/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package org.phenotips.hpoa.utils.maps;

import java.util.Collection;
import java.util.LinkedHashSet;

public class SetMap<K extends Comparable<? super K>, V> extends AbstractCollectionMap<K, V>
{
    private static final long serialVersionUID = 201202091730L;

    @Override
    protected Collection<V> getEmptyCollection()
    {
        return new LinkedHashSet<V>();
    }
}